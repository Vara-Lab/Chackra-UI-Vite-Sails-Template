import { Center, VStack } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function Landing() {
  return (
    <Center>
      <VStack>
        <Button textColor="black" bg="#00ffc4" as={Link} to="/home">
          Examples
        </Button>
      </VStack>
    </Center>
  );
}

export { Landing };
