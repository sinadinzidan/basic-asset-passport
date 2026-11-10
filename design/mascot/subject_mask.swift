// Writes the subject mask of an image as a greyscale PNG, using the macOS Vision framework.
//
//     xcrun swift design/mascot/subject_mask.swift <image> <mask.png>

import CoreImage
import Foundation
import Vision

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
    FileHandle.standardError.write(Data("usage: subject_mask.swift <image> <mask.png>\n".utf8))
    exit(2)
}
guard let image = CIImage(contentsOf: URL(fileURLWithPath: arguments[1])) else {
    FileHandle.standardError.write(Data("Could not read \(arguments[1])\n".utf8))
    exit(1)
}

let handler = VNImageRequestHandler(ciImage: image)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let subject = request.results?.first else {
    FileHandle.standardError.write(Data("No subject found in \(arguments[1])\n".utf8))
    exit(1)
}

let buffer = try subject.generateScaledMaskForImage(forInstances: subject.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: buffer)
try CIContext().writePNGRepresentation(
    of: mask,
    to: URL(fileURLWithPath: arguments[2]),
    format: .L8,
    colorSpace: CGColorSpace(name: CGColorSpace.linearGray)!
)
print("mask \(Int(mask.extent.width))x\(Int(mask.extent.height))")
